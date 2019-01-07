<template>
  <div class="app-container">

    <div class="filter-container">
      <el-input :placeholder="$t('table.realname')" v-model="listQuery.where.realName" style="width: 200px;" class="filter-item" @keyup.enter.native="handleFilter"/>
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

      <el-table-column :label="$t('table.id')" prop="id" sortable align="center" width="150">
        <template slot-scope="scope">
          <span>{{ scope.row.id }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('login.username')" align="center" width="170">
        <template slot-scope="scope">
          <span>{{ scope.row.userName }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.realname')" align="center" width="170">
        <template slot-scope="scope">
          <span>{{ scope.row.realName }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.group')" align="center" width="240">
        <template slot-scope="scope">
          <span class="link-type" @click="handleGroup(scope.row)">{{ groupName(scope.row.group) }}</span>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.status')" class-name="status-col" width="151">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status | statusFilter">{{ scope.row.status | statusName }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.actions')" align="center" width="300" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button type="primary" size="mini" @click="handleUpdate(scope.row)"><svg-icon icon-class="edit" /></el-button>
          <el-button v-if="scope.row.status===0" size="mini" type="success" @click="handleModifyStatus(scope.row,1)">{{ $t('table.open') }}
          </el-button>
          <el-button v-if="scope.row.status===1" size="mini" type="danger" @click="handleModifyStatus(scope.row,0)">{{ $t('table.delete') }}
          </el-button>
        </template>
      </el-table-column>

      <el-table-column :label="$t('table.date')" width="440" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.update_time }}</span>
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit.size" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">

        <el-form-item :label="$t('table.realname')" prop="name">
          <el-input v-model="temp.realName"/>
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

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogGroupVisible">

      <div>
        <el-checkbox-group v-model="checkboxGroup">
          <el-checkbox-button v-for="(group,id) in groupMap" :label="id" :key="id">{{ group }}</el-checkbox-button>
        </el-checkbox-group>
      </div>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogGroupVisible = false">{{ $t('table.cancel') }}</el-button>
        <el-button type="primary" @click="updateRow()">{{ $t('table.confirm') }}</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import userApi from '@/api/system/user'
import groupApi from '@/api/system/userGroup'
import waves from '@/directive/waves' // Waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // Secondary package based on el-pagination

export default {
  name: 'UserGroup',
  components: { Pagination },
  directives: { waves },
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
          realName: undefined,
          status: undefined
        },
        order: {
          update_time: 'desc'
        }
      },
      statusOptions: ['stop', 'open'],
      temp: {
        id: undefined,
        realName: '',
        status: ''
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create',
        route: 'Route',
        game: 'Game'
      },
      dialogGroupVisible: false,
      groupMap: [],
      groupList: [],
      checkboxGroup: [],
      saveRow: {},
      rules: {
        realName: [{ required: true, message: 'realname is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },
  created() {
    this.getList()
    this.getGroupMap()
  },
  methods: {
    show() {
      console.log(this.checkboxGroup)
    },
    groupName(group) {
      if (!group) {
        return '无'
      }
      const groupArr = group.split(',')
      const result = []
      groupArr.forEach(element => {
        result.push(this.groupMap[element])
      })
      return result.join(',')
    },
    getList() {
      this.listLoading = true
      userApi.fetchList(this.listQuery).then(response => {
        this.total = response.data.total

        if (response.data.total === 1) {
          this.list = [response.data.items]
        } else {
          this.list = response.data.items
        }

        this.listLoading = false
      })
    },
    getGroupMap() {
      groupApi.fetchMap().then((response) => {
        this.groupMap = response.data
      })
    },
    handleFilter() {
      this.listQuery.limit.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      row.status = status
      userApi.update(row).then((response) => {
        this.$message({
          message: response.msg,
          type: 'success'
        })
        console.log(response)
      })
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
          userApi.create(this.temp).then((response) => {
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
          userApi.update(tempData).then(() => {
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
      this.saveRow.group = this.checkboxGroup.join(',')
      userApi.update(this.saveRow).then((response) => {
        this.dialogGroupVisible = false
        this.$notify({
          title: '成功',
          message: '更新成功',
          type: 'success',
          duration: 2000
        })
      })
    },
    handleGroup(row) {
      this.saveRow = row
      this.checkboxGroup = row.group ? row.group.split(',') : []
      this.dialogGroupVisible = true
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
