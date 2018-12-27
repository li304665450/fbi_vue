<template>
  <div class="app-container">

    <div class="filter-container">
      <el-input :placeholder="$t('table.group')" v-model="listQuery.where.name" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      <el-select v-model="listQuery.where.status" :placeholder="$t('table.status')" clearable style="width: 90px" class="filter-item">
        <el-option v-for="(item,key) in statusOptions" :key="key" :label="item" :value="key"/>
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">{{ $t('table.search') }}</el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">{{ $t('table.add') }}</el-button>
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">{{ $t('table.export') }}</el-button>
    </div>

    <el-table
      v-loading="listLoading"
      :key="tableKey"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;">

      <el-table-column :label="$t('table.id')" prop="id" sortable align="center" width="85">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.group')" align="center" width="430">
        <template slot-scope="scope">
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.status')" class-name="status-col" width="140">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">{{ scope.row.status | statusName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" width="600" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"><svg-icon icon-class="edit" /></el-button>
          <el-button type="info" size="mini" @click="handleRoute(scope.row)"><svg-icon icon-class="nested" /></el-button>
          <el-button type="warning" size="mini" @click="handleGame(scope.row)"><svg-icon icon-class="list" /></el-button>
          <el-button v-if="scope.row.status===0" size="mini" type="success" @click="handleModifyStatus(scope.row,1)">{{ $t('table.open') }}
          </el-button>
          <el-button v-if="scope.row.status===1" size="mini" type="danger" @click="handleModifyStatus(scope.row,0)">{{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.date')" width="360" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.update_time }}</span>
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit.size" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">

        <el-form-item :label="$t('table.group')" prop="name">
          <el-input v-model="temp.name"/>
        </el-form-item>

        <el-form-item :label="$t('table.status')">
          <el-select v-model="temp.status" class="filter-item" placeholder="Please select">
            <el-option v-for="(item,key) in statusOptions" :key="key" :label="item" :value="key"/>
          </el-select>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">{{ $t('table.confirm') }}</el-button>
      </div>
    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogRouteVisible">
      <tree-table :data="routeList" :eval-func="func" :eval-args="args" :expand-all="expandAll" name="routeTree">

        <el-table-column label="页面">
          <template slot-scope="scope">
            <span style="color:sandybrown">{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-switch v-if="scope.row.status !== undefined" v-model="scope.row.status" @change="saveRoute(scope.row)" />
          </template>
        </el-table-column>

      </tree-table>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogRouteVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" @click="updateRow()">{{ $t('table.confirm') }}</el-button>
      </div>

    </el-dialog>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogGameVisible">

      <tree-table :data="gameList" :eval-func="func" :eval-args="args" :expand-all="expandAll" name="gameTree">

        <el-table-column label="游戏">
          <template slot-scope="scope">
            <span style="color:sandybrown">{{ scope.row.name }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-switch v-if="scope.row.status !== undefined" v-model="scope.row.status" @change="saveGame(scope.row)"/>
          </template>
        </el-table-column>

      </tree-table>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogGameVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" @click="updateRow()">{{ $t('table.confirm') }}</el-button>
      </div>

    </el-dialog>

  </div>
</template>

<script>
import groupApi from '@/api/system/userGroup'
import gameApi from '@/api/system/game'
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import treeTable from '@/components/TreeTable'
import treeToArray from './customEval'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination
import { asyncRouterMap } from '@/router'

export default {
  name: 'UserGroup',
  directives: { waves },
  components: { treeTable },
  filters: {
    statusFilter(status) {
      const statusMap = ['danger', 'success']
      return statusMap[status]
    },
    statusName(status) {
      const statusName = ['stop', 'open']
      return statusName[status]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        limit: {
          page: 1,
          size: 20
        },
        where: {
          name: undefined,
          status: undefined
        },
        order: {
          update_time: 'desc'
        }
      },
      statusOptions: ['stop', 'open'],
      temp: {
        id: undefined,
        name: '',
        status: ''
      },
      dialogFormVisible: false,
      components: { Pagination },
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create',
        route: 'Route',
        game: 'Game'
      },
      dialogRouteVisible: false,
      routeList: [],
      func: treeToArray,
      expandAll: false,
      args: [null, null, 'timeLine'],
      dialogGameVisible: false,
      gameTree: [],
      gameList: [],
      saveRow: {},
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
    this.getGameTree()
  },
  methods: {
    getList() {
      this.listLoading = true
      groupApi.fetchList(this.listQuery).then(response => {
        this.total = response.data.total

        if (response.data.total === 1) {
          this.list = [response.data.items]
        } else {
          this.list = response.data.items
        }

        this.listLoading = false
      })
    },
    getGameTree() {
      gameApi.fetchTree().then((response) => {
        this.gameTree = response.data
      })
    },
    handleFilter() {
      this.listQuery.limit.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      row.status = status
      groupApi.update(row).then((response) => {
        this.$message({
          message: response.msg,
          type: 'success'
        })
        console.log(response)
      })
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        status: 1
      }
    },
    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          delete this.temp.id
          groupApi.create(this.temp).then((response) => {
            this.temp.id = response.data
            this.temp.update_time = parseTime(new Date(), '{y}-{m}-{d} {h}:{i}:{s}')
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          groupApi.update(tempData).then(() => {
            // this.list.splice(this.list.indexOf(item => item.id === this.temp.id), 1, this.temp)
            for (const v of this.list) {
              if (v.id === this.temp.id) {
                const index = this.list.indexOf(v)
                this.list.splice(index, 1, this.temp)
                break
              }
            }
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    updateRow() {
      groupApi.update(this.saveRow).then((response) => {
        this.dialogRouteVisible = false
        this.dialogGameVisible = false
        this.$notify({
          title: '成功',
          message: '更新成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleRoute(row) {
      const format = (routes, access) => {
        const routeList = []
        routes.forEach(route => {
          if (route.children) {
            if (route.meta) {
              routeList.push({
                name: this.$t('route.' + route.meta.title),
                access: route.meta.title,
                children: format(route.children, access)
              })
            }
          } else {
            if (route.meta) {
              const routeStatus = access.includes(route.meta.title)
              routeList.push({
                name: this.$t('route.' + route.meta.title),
                access: route.meta.title,
                status: routeStatus
              })
            }
          }
        })
        return routeList
      }
      this.routeList = format(asyncRouterMap, row.access)
      this.saveRow = row
      this.dialogStatus = 'route'
      this.dialogRouteVisible = true
    },
    saveRoute(row) {
      if (row.status) {
        this.saveRow.access.push(row.access)
      } else {
        this.saveRow.access.splice(this.saveRow.access.findIndex(item => item === row.access), 1)
      }
    },
    handleGame(row) {
      const formatGame = (gameTree, access_game) => {
        const gameList = []
        gameTree.forEach((game) => {
          if (game.access_game === undefined) {
            const gameChildren = game.children === undefined ? [] : formatGame(game.children, access_game)
            gameList.push({
              id: game.id,
              name: game.name,
              children: gameChildren
            })
          } else {
            const gameStatus = access_game.includes(game.access_game)
            gameList.push({
              id: game.id,
              name: game.name,
              access_game: game.access_game,
              status: gameStatus
            })
          }
        })
        return gameList
      }
      this.gameList = formatGame(this.gameTree, row.access_game)
      this.dialogStatus = 'game'
      this.dialogGameVisible = true
      this.saveRow = row
    },
    saveGame(row) {
      if (row.status) {
        this.saveRow.access_game.push(row.access_game)
      } else {
        this.saveRow.access_game.splice(this.saveRow.access_game.findIndex(item => item === row.access_game), 1)
      }
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = ['timestamp', 'title', 'type', 'importance', 'status']
        const data = this.formatJson(filterVal, this.list)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
        } else {
          return v[j]
        }
      }))
    }
  }
}
</script>
