<template>
  <div class="app-container">

    <div class="filter-container">
      <el-input :placeholder="$t('table.name')" v-model="listQuery.where.name" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
      <el-select v-model="listQuery.where.status" :placeholder="$t('table.status')" clearable style="width: 90px" class="filter-item">
        <el-option v-for="(item,key) in statusOptions" :key="key" :label="item" :value="key"/>
      </el-select>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">{{ $t('table.search') }}</el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">{{ $t('table.add') }}</el-button>
      <el-button v-clipboard:copy="111" v-clipboard:success="clipboardSuccess" class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit">copy</el-button>
    </div>

    <tree-table :data="list" :eval-func="func" :eval-args="args" :expand-all="expandAll" border>

      <el-table-column label="游戏" align="center">
        <template slot-scope="scope">
          <span style="color:sandybrown">{{ scope.row.name }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.code')" align="center">
        <template slot-scope="scope">
          <span style="color:sandybrown">{{ scope.row.code_id }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.status')" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">{{ scope.row.status | statusName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" align="center">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"><svg-icon icon-class="edit" /></el-button>
          <el-button v-if="scope.row.status===0" size="mini" type="success" @click="handleModifyStatus(scope.row,1)">{{ $t('table.open') }}
          </el-button>
          <el-button v-if="scope.row.status===1" size="mini" type="danger" @click="handleModifyStatus(scope.row,0)">{{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>

    </tree-table>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">

        <el-form-item :label="$t('table.name')" prop="name">
          <el-input v-model="temp.name"/>
        </el-form-item>

        <el-form-item :label="$t('table.code')" prop="name">
          <el-input v-model="temp.code_id"/>
        </el-form-item>

        <el-form-item v-if="dialogStatus == 'create'" :label="$t('table.type')">
          <el-select v-model="gameType" class="filter-item" placeholder="Please select">
            <el-option v-for="(item,key) in typeOptions" :key="key" :label="item" :value="key"/>
          </el-select>
        </el-form-item>

        <el-form-item v-if="gameType == 1" :label="$t('table.cloud')">
          <el-select v-model="temp.pid" class="filter-item" placeholder="Please select">
            <el-option v-for="item in cloudList" :key="item.code_id" :label="item.name" :value="item.code_id"/>
          </el-select>
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

  </div>
</template>

<script>
import treeTable from '@/components/TreeTable'
import treeToArray from './customEval'
import gameApi from '@/api/system/game'
import Pagination from '@/components/Pagination'
import waves from '@/directive/waves'
import clipboard from '@/directive/clipboard/index.js'

export default {
  name: 'CustomTreeTableDemo',
  directives: { waves, clipboard },
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
      func: treeToArray,
      expandAll: false,
      args: [null, null, 'timeLine'],
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
      cloudList: [],
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
      typeOptions: ['cloud', 'game'],
      temp: {
        id: undefined,
        name: '',
        type: '',
        status: ''
      },
      dialogFormVisible: false,
      components: { Pagination },
      dialogStatus: '',
      gameType: 0,
      textMap: {
        update: 'Edit',
        create: 'Create',
        route: 'Route',
        game: 'Game'
      },
      rules: {
        name: [{ required: true, message: 'name is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      let gameTree = []
      gameApi.fetchList(this.listQuery).then(response => {
        gameTree = response.data
        const formatGame = (gameTree) => {
          const gameList = []
          gameTree.forEach((game) => {
            if (game.access_game === undefined) {
              const gameChildren = game.children === undefined ? [] : formatGame(game.children)
              gameList.push({
                id: game.id,
                code_id: game.code_id,
                name: game.name,
                status: game.status,
                children: gameChildren
              })
              if (game.status === 1) {
                this.cloudList.push({
                  code_id: game.code_id,
                  name: game.name
                })
              }
            } else {
              gameList.push({
                id: game.id,
                code_id: game.code_id,
                name: game.name,
                status: game.status,
                pid: game.pid
              })
            }
          })
          return gameList
        }
        this.list = formatGame(gameTree)
      })
    },
    handleFilter() {
      this.listQuery.limit.page = 1
      this.getList()
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
          delete this.temp.type
          gameApi.create(this.temp).then((response) => {
            // this.$router.push({
            //   path: '/system/game',
            //   query: {
            //     t: +new Date()
            //   }
            // })
            this.getList()
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
    handleModifyStatus(row, status) {
      const temp = {}
      temp.id = row.id
      temp.status = status
      gameApi.update(temp).then((response) => {
        this.$message({
          message: response.msg,
          type: 'success'
        })
        row.status = status
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.gameType = this.temp.pid ? 1 : 0
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          // const tempData = Object.assign({}, this.temp)
          const tempData = {}
          tempData.id = this.temp.id
          tempData.code_id = this.temp.code_id
          tempData.name = this.temp.name
          tempData.status = this.temp.status
          tempData.pid = this.temp.pid
          gameApi.update(tempData).then(() => {
            // this.$router.push({
            //   path: '/system/game',
            //   query: {
            //     t: +new Date()
            //   }
            // })
            this.getList()
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
    clipboardSuccess() {
      this.$notify({
        title: '成功',
        message: '复制成功',
        type: 'success',
        duration: 2000
      })
    }
  }
}
</script>
